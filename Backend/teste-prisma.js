require("dotenv").config();
const prisma = require("./src/prisma");

async function main(){
    const users = prisma.user.findMany();
    console.log("Usuarios no banco: ", users)
}

main()
    .catch((e) => console.err(e))
    .finally(async() => {
        await prisma.$disconnect();
    })
