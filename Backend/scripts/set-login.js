require("dotenv").config();
const prisma = require("../src/prisma");

async function main() {
  await prisma.user.update({
    where: { email: "kelven@example.com" },
    data: { login: "kelven.silva" },
  });

  console.log("Login atualizado com sucesso!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
