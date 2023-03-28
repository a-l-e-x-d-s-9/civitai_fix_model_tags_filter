import { Anchor, Button, Container, Group, Stack, Stepper, Text, Title } from '@mantine/core';
import { useDidUpdate } from '@mantine/hooks';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { ModelVersionUpsertForm } from '~/components/Resource/Forms/ModelVersionUpsertForm';
import { PostEditWrapper } from '~/components/Post/Edit/PostEditLayout';
import { Files } from '~/components/Resource/Files';
import { trpc } from '~/utils/trpc';
import { PostUpsertForm } from '../Forms/PostUpsertForm';
import { ModelById } from '~/types/router';
import { useS3UploadStore } from '~/store/s3-upload.store';
import { openConfirmModal } from '@mantine/modals';

export function ModelVersionWizard({ data }: Props) {
  const router = useRouter();

  const { id, versionId, step = '1' } = router.query;
  const parsedStep = Array.isArray(step) ? Number(step[0]) : Number(step);

  const [activeStep, setActiveStep] = useState<number>(parsedStep);

  const { data: modelVersion } = trpc.modelVersion.getById.useQuery(
    { id: Number(versionId), withFiles: true },
    {
      enabled: !!versionId,
      placeholderData: {
        model: { ...data },
      },
    }
  );

  const goNext = () => {
    if (activeStep < 3) {
      setActiveStep((current) => current + 1);
    }
  };

  const goBack = () => {
    if (activeStep > 1) {
      setActiveStep((current) => current - 1);
    }
  };

  useDidUpdate(() => {
    if (modelVersion?.id)
      router.push(
        `/models/v2/${id}/model-versions/${modelVersion.id}/wizard?step=${activeStep}`,
        undefined,
        { shallow: true }
      );
  }, [id, activeStep, modelVersion]);

  const editing = !!modelVersion?.id;
  const postId = modelVersion?.posts?.[0]?.id;

  return (
    <Container size="sm">
      <Stack spacing="xl" py="xl">
        <Link href={`/models/v2/${id}`} passHref>
          <Anchor size="xs">
            <Group spacing={4} noWrap>
              <IconArrowLeft size={12} />
              <Text inherit>Back to {modelVersion?.model.name} page</Text>
            </Group>
          </Anchor>
        </Link>
        <Stepper
          active={activeStep - 1}
          onStepClick={(step) => setActiveStep(step + 1)}
          allowNextStepsSelect={false}
          size="sm"
        >
          <Stepper.Step label={editing ? 'Edit version' : 'Add version'}>
            <Stack>
              <Title order={3}>{editing ? 'Edit version' : 'Add version'}</Title>
              <ModelVersionUpsertForm
                model={modelVersion?.model}
                version={modelVersion}
                onSubmit={(result) => {
                  if (editing) return goNext();
                  router.replace(
                    `/models/v2/${id}/model-versions/${result?.id}/wizard?step=2`,
                    undefined,
                    {
                      shallow: true,
                    }
                  );
                }}
              >
                {({ loading }) => (
                  <Group mt="xl" position="right">
                    <Button type="submit" loading={loading}>
                      Next
                    </Button>
                  </Group>
                )}
              </ModelVersionUpsertForm>
            </Stack>
          </Stepper.Step>
          <Stepper.Step label="Upload files">
            <Stack spacing="xl">
              <Title order={3}>Upload files</Title>
              <Files model={modelVersion?.model} version={modelVersion} />
              <Group position="right">
                <Button variant="default" onClick={goBack}>
                  Back
                </Button>
                <Button
                  onClick={() => {
                    const { uploading = 0, success = 0 } = useS3UploadStore
                      .getState()
                      .getStatus((item) => item.meta?.versionId === modelVersion?.id);

                    const showConfirmModal =
                      (uploading > 0 && success === 0) || !modelVersion?.files.length;

                    if (showConfirmModal) {
                      return openConfirmModal({
                        title: (
                          <Group spacing="xs">
                            <IconAlertTriangle color="gold" />
                            <Text size="lg">Missing files</Text>
                          </Group>
                        ),
                        children:
                          'You have not uploaded any files. You can continue without files, but you will not be able to publish your model. Are you sure you want to continue?',
                        labels: { cancel: 'Cancel', confirm: 'Continue' },
                        onConfirm: goNext,
                      });
                    }

                    return goNext();
                  }}
                >
                  Next
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>
          <Stepper.Step label={postId ? 'Edit post' : 'Create a post'}>
            <Stack spacing="xl">
              <Title order={3}>{postId ? 'Edit post' : 'Create your post'}</Title>
              {modelVersion && (
                <PostEditWrapper postId={postId}>
                  <PostUpsertForm
                    modelVersionId={modelVersion.id}
                    modelId={modelVersion.model.id}
                  />
                </PostEditWrapper>
              )}
            </Stack>
          </Stepper.Step>
        </Stepper>
      </Stack>
    </Container>
  );
}

type Props = {
  data?: ModelById;
};
