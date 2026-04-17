import prisma from '#src/config/database.ts';

export async function getTryOnImage(id: string) {
  const tryonImage = await prisma.tryon.findUnique({
    where: { id },
    select: {
      resultUrl: true,
    },
  });
  return tryonImage?.resultUrl;
}
