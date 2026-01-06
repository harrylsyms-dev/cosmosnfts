import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const nfts = await prisma.nFT.findMany({
    select: {
      name: true,
      objectType: true,
      imagePrompt: true,
      imageNegativePrompt: true
    },
    orderBy: [
      { objectType: 'asc' },
      { name: 'asc' }
    ]
  });

  let csv = 'Name,Object Type,Prompt,Negative Prompt\n';

  for (const nft of nfts) {
    const prompt = (nft.imagePrompt || '').replace(/"/g, '""').replace(/\n/g, ' ');
    const negPrompt = (nft.imageNegativePrompt || '').replace(/"/g, '""').replace(/\n/g, ' ');
    csv += `"${nft.name}","${nft.objectType}","${prompt}","${negPrompt}"\n`;
  }

  const outputPath = path.join(process.cwd(), 'NFT_Prompts.csv');
  fs.writeFileSync(outputPath, csv);
  console.log(`Exported ${nfts.length} prompts to: ${outputPath}`);

  await prisma.$disconnect();
}

main();
