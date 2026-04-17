import prisma from '#src/config/database.ts';

async function getTryOnImage(id: string) {
  return await prisma.tryon.findUnique({
    where: { id },
    select: {
      resultUrl: true,
    },
  });
}
