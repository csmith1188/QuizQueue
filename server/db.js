let dbInstance = null;

module.exports = function (sqlite3, fs) {

    if (!dbInstance) {
        const dbPath = './database.db';
        if (fs.existsSync(dbPath)) {
            console.log('Database file exists.');
        } else {
            console.log('Database file does not exist. It will be created.');
        }

        // Create or open the database
        dbInstance = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to the SQLite database.');
                dbInstance.run(`CREATE TABLE IF NOT EXISTS "user" (
                    "uid"	INTEGER NOT NULL UNIQUE,
                    "username"	TEXT NOT NULL UNIQUE,
                    "email"	TEXT NOT NULL UNIQUE,
                    PRIMARY KEY("uid" AUTOINCREMENT)
                );`, (err) => {
                    if (err) {
                        console.error('Error creating table 1:', err.message);
                    }
                });

                dbInstance.run(`CREATE TABLE IF NOT EXISTS classes(
                    "class" TEXT NOT NULL,
                    "uid" INTEGER NOT NULL,
                    "ownerID" INTEGER NOT NULL,
                    PRIMARY KEY("class")
                );`, (err) => {
                    if (err) {
                        console.error('Error creating table 2:', err.message);
                    }
                });
            }
        });
    }

    return dbInstance;
};