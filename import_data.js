// import_data.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function syncSequence(tableName, columnName = 'id') {
    await prisma.$executeRawUnsafe(`
        SELECT setval(
            pg_get_serial_sequence('"${tableName}"', '${columnName}'),
            COALESCE((SELECT MAX("${columnName}") FROM "${tableName}"), 1)
        )
    `);
}

async function main() {
    const databaseData = process.argv[2];
    const citiesFile = `${databaseData}/cities.json`;
    const airportsFile = `${databaseData}/airports.json`;
    const hotelsFile = `${databaseData}/hotels.json`;
    const bookingsFile = `${databaseData}/bookings.json`;
    const paymentsFile = `${databaseData}/payments.json`;
    const roomsFile = `${databaseData}/rooms.json`;
    const usersFile = `${databaseData}/users.json`;

    if (!databaseData) {
        console.error("Usage: node import_data.js <database_data folder>");
        process.exit(1);
    }

    console.log(`Clearing all tables...`);
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.room.deleteMany();
    await prisma.hotel.deleteMany();
    await prisma.user.deleteMany();
    await prisma.city.deleteMany();
    await prisma.airport.deleteMany();
    console.log(`Cleared all tables.`);

    // Read and parse the cities JSON file
    const citiesData = JSON.parse(fs.readFileSync(citiesFile, 'utf8'));
    console.log(`Importing ${citiesData.length} cities...`);
    try {
        await prisma.city.createMany({
            data: citiesData,
        });
        console.log("Cities import complete.");
    } catch (error) {
        console.error("Error importing cities:", error);
    }

    // Read and parse the airports JSON file
    const airportsData = JSON.parse(fs.readFileSync(airportsFile, 'utf8'));
    console.log(`Importing ${airportsData.length} airports...`);
    try {
        await prisma.airport.createMany({
            data: airportsData,
        });
        console.log("Airports import complete.");
    } catch (error) {
        console.error("Error importing airports:", error);
    }

    // Read and parse the users JSON file
    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    console.log(`Importing ${usersData.length} users...`);
    try {
        await prisma.user.createMany({
            data: usersData,
        });
        console.log("Users import complete.");
    } catch (error) {
        console.error("Error importing users:", error);
    }

    // Read and parse the hotels JSON file
    const hotelsData = JSON.parse(fs.readFileSync(hotelsFile, 'utf8'));
    console.log(`Importing ${hotelsData.length} hotels...`);
    try {
        await prisma.hotel.createMany({
            data: hotelsData,
        });
        console.log("Hotels import complete.");
    } catch (error) {
        console.error("Error importing hotels:", error);
    }

    // Read and parse the rooms JSON file
    const roomsData = JSON.parse(fs.readFileSync(roomsFile, 'utf8'));
    console.log(`Importing ${roomsData.length} rooms...`);
    try {
        await prisma.room.createMany({
            data: roomsData,
        });
        console.log("Rooms import complete.");
    } catch (error) {
        console.error("Error importing rooms:", error);
    }

    // Read and parse the bookings JSON file
    const bookingsData = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
    console.log(`Importing ${bookingsData.length} bookings...`);
    try {
        await prisma.booking.createMany({
            data: bookingsData,
        });
        console.log("Bookings import complete.");
    } catch (error) {
        console.error("Error importing bookings:", error);
    }

    // Read and parse the payments JSON file
    const paymentsData = JSON.parse(fs.readFileSync(paymentsFile, 'utf8'));
    console.log(`Importing ${paymentsData.length} payments...`);
    try {
        await prisma.payment.createMany({
            data: paymentsData,
        });
        console.log("Payments import complete.");
    } catch (error) {
        console.error("Error importing payments:", error);
    }

    await syncSequence('User');
    await syncSequence('Hotel');
    await syncSequence('Room');
    await syncSequence('Booking');
    await syncSequence('Payment');
    await syncSequence('Notification');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
