import React, { useState } from 'react';
import { FeedLayout } from '~/pages/clubs/[id]/index';
import { useRouter } from 'next/router';
import { Group, Stack } from '@mantine/core';
import { constants } from '~/server/common/constants';
import { MasonryContainer } from '~/components/MasonryColumns/MasonryContainer';
import { PeriodFilter, SortFilter } from '~/components/Filters';
import { ModelSort } from '~/server/common/enums';
import { DumbModelFiltersDropdown } from '~/components/Model/Infinite/ModelFiltersDropdown';
import { ModelsInfinite } from '~/components/Model/Infinite/ModelsInfinite';
import { MasonryProvider } from '~/components/MasonryColumns/MasonryProvider';
import { ModelQueryParams, useModelQueryParams } from '~/components/Model/model.utils';
import { MetricTimeframe } from '@prisma/client';
import { ModelFilterSchema } from '../../../providers/FiltersProvider';

const ClubModels = () => {
  const router = useRouter();
  const { id: stringId } = router.query as {
    id: string;
  };
  const id = Number(stringId);
  const [filters, setFilters] = useState<Partial<ModelFilterSchema> & { clubId: number }>({
    sort: ModelSort.Newest,
    period: MetricTimeframe.AllTime,
    clubId: id,
  });

  return (
    <>
      <Stack mb="sm">
        <Group position="apart" spacing={0}>
          <SortFilter
            type="models"
            value={filters.sort as ModelSort}
            onChange={(x) => setFilters((f) => ({ ...f, sort: x as ModelSort }))}
          />
          <Group spacing="xs">
            <DumbModelFiltersDropdown
              filters={filters}
              setFilters={(updated) => setFilters((f) => ({ ...f, ...updated }))}
            />
          </Group>
        </Group>
      </Stack>
      <MasonryProvider columnWidth={constants.cardSizes.model} maxColumnCount={7}>
        <MasonryContainer fluid mt="md" p={0}>
          <ModelsInfinite
            useStoreFilters={false}
            filters={{
              ...filters,
            }}
          />
        </MasonryContainer>
      </MasonryProvider>
    </>
  );
};

ClubModels.getLayout = function getLayout(page: React.ReactNode) {
  return <FeedLayout>{page}</FeedLayout>;
};

export default ClubModels;
