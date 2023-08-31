import { Prisma } from '@prisma/client';
import { dbRead, dbWrite } from '../db/client';
import { GetByIdInput, InfiniteQueryInput } from '../schema/base.schema';
import { getFilesByEntity } from './file.service';
import { throwNotFoundError } from '../utils/errorHandling';
import { UpsertBountyInput } from '../schema/bounty.schema';

export const getAllBounties = ({ cursor, limit: take }: InfiniteQueryInput) => {
  return dbRead.bounty.findMany({
    take,
    cursor: cursor ? { id: cursor } : undefined,
    select: { id: true, name: true, expiresAt: true },
  });
};

export const getBountyById = async <TSelect extends Prisma.BountySelect>({
  id,
  select,
}: GetByIdInput & { select: TSelect }) => {
  const bounty = await dbRead.bounty.findUnique({ where: { id }, select });
  if (!bounty) throw throwNotFoundError(`No bounty with id ${id}`);

  const files = await getFilesByEntity({ id: bounty.id, type: 'Bounty' });

  return { ...bounty, files };
};

// TODO.bounty: handle details and tags
export const createBounty = async ({
  files,
  details,
  tags,
  ...data
}: UpsertBountyInput & { userId: number }) => {
  const bounty = await dbWrite.$transaction(async (tx) => {
    const bounty = await tx.bounty.create({ data });

    if (files) {
      await tx.file.createMany({
        data: files.map((file) => ({ ...file, entityId: bounty.id, entityType: 'Bounty' })),
      });
    }

    return bounty;
  });

  return bounty;
};

// TODO.bounty: handle details and tags
export const updateBountyById = async ({
  id,
  files,
  details,
  tags,
  ...data
}: UpsertBountyInput) => {
  const bounty = await dbWrite.$transaction(async (tx) => {
    const bounty = await tx.bounty.update({ where: { id }, data });
    if (!bounty) return null;

    if (files) {
      await tx.file.deleteMany({ where: { entityId: id, entityType: 'Bounty' } });
      await tx.file.createMany({
        data: files.map((file) => ({ ...file, entityId: bounty.id, entityType: 'Bounty' })),
      });
    }

    return bounty;
  });

  return bounty;
};

export const deleteBountyById = async ({ id }: GetByIdInput) => {
  const bounty = await dbWrite.$transaction(async (tx) => {
    const deletedBounty = await tx.bounty.delete({ where: { id } });
    if (!deletedBounty) return null;

    await tx.file.deleteMany({ where: { entityId: id, entityType: 'Bounty' } });

    return deletedBounty;
  });

  return bounty;
};
