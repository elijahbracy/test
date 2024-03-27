require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const assert = require('assert');
const { promisify } = require('util');
//const UserModel = require('./models/userModel');



class CageDB {

    constructor() {
        this.dbFilePath = process.env.DBPATH;
        assert.ok(this.dbFilePath, "Database file path is not defined.");
    }

    async connect() {
        // Check if the database file exists, create it if not
        if (!fs.existsSync(this.dbFilePath)) {
            await promisify(fs.writeFile)(this.dbFilePath, ''); // Create an empty file
        }

        // Create connection
        this.knex = require('knex')({
            client: 'sqlite3',
            connection: {
                filename: this.dbFilePath,
            },
            useNullAsDefault: true
        });

        return this.knex;
    }

    async initialize() {
        // Connect to db
        const knex = await this.connect();

        // Make sure connection was established
        if (!this.knex) {
            throw new Error('Connection not established. Call connect() first.');
        }

        // Check if tables exist
        const usersTableExists = await knex.schema.hasTable('Users');
        const equipmentTableExists = await knex.schema.hasTable('Equipment');
        const rentalsTableExists = await knex.schema.hasTable('Rentals');
        const rentalEquipmentTableExists = await knex.schema.hasTable('RentalEquipment');
        const availabilityTableExists = await knex.schema.hasTable('Availability');
    
        if (!usersTableExists) {
            await knex.schema.createTable('Users', function(table) {
                table.increments('user_id').primary();
                table.string('first_name');
                table.string('last_name');
                table.string('email');
                table.string('sub');
                table.boolean('isAdmin').defaultTo(false); // Add isAdmin column, default to false
            });
        }
        
        if (!equipmentTableExists) {
            await knex.schema.createTable('Equipment', function(table) {
                table.increments('equipment_id').primary();
                table.string('name');
                table.integer('quantity').defaultTo(0);
            });
        }

        if (!rentalsTableExists) {
            await knex.schema.createTable('Rentals', function(table) {
                table.increments('rental_id').primary();
                table.integer('user_id').unsigned().references('Users.user_id');
                table.date('rental_start_date').nullable();
                table.date('rental_end_date').nullable();
                table.string('rental_status');
            });
        }
        

        if (!rentalEquipmentTableExists) {
            await knex.schema.createTable('RentalEquipment', function(table) {
                table.integer('rental_id').unsigned().references('Rentals.rental_id');
                table.integer('equipment_id').unsigned().references('Equipment.equipment_id');
                table.primary(['rental_id', 'equipment_id']); // Make the combination of rental_id and equipment_id as the primary key
            });
        }
        

        if (!availabilityTableExists) {
            await knex.schema.createTable('Availability', function(table) {
                table.increments('availability_id').primary();
                table.integer('equipment_id').unsigned().references('Equipment.equipment_id');
                table.integer('available_quantity');
                table.date('available_date');
            });
        }

        // Check if the trigger exists

        async function checkTriggerExists(triggerName) {
            const [result] = await knex.raw(`SELECT 1 FROM sqlite_master WHERE type='trigger' AND name='${triggerName}'`);
            return !!result;
        }
        
        const availabilityInsertTrigger = await checkTriggerExists('decrement_availability_insert');
        
        const availabilityUpdateTrigger = await checkTriggerExists('decrement_availability_update');

        if (!availabilityInsertTrigger) {
            // Add trigger to decrement availability on rental insert
            await knex.schema.raw(`
            CREATE TRIGGER decrement_availability_insert
            AFTER INSERT ON RentalEquipment
            FOR EACH ROW
            BEGIN
                UPDATE Availability 
                SET available_quantity = 
                    CASE
                        WHEN NEW.rental_status = 'approved' THEN available_quantity - 1
                        WHEN NEW.rental_status = 'in progress' THEN available_quantity - 1
                        ELSE available_quantity
                    END
                WHERE equipment_id = NEW.equipment_id;
            END;
            `);
        }

        if (!availabilityUpdateTrigger) {
            // Add trigger to decrement availability on rental update
            await knex.schema.raw(`
            CREATE TRIGGER decrement_availability_update
            AFTER UPDATE ON RentalEquipment
            FOR EACH ROW
            BEGIN
                UPDATE Availability 
                SET available_quantity = 
                    CASE
                        WHEN NEW.rental_status = 'approved' AND OLD.rental_status <> 'approved' THEN available_quantity - 1
                        WHEN NEW.rental_status = 'in progress' AND OLD.rental_status <> 'in progress' THEN available_quantity - 1
                        ELSE available_quantity
                    END
                WHERE equipment_id = NEW.equipment_id;
            END;
            `);
        }
    }

    async getUserByEmail(email) {
        try {
            // Ensure that the connection is established
            if (!this.knex) {
                throw new Error('Connection not established. Call connect() first.');
            }

            // Query the database for the user with the given email
            const user = await this.knex('Users').where('email', email).first();

            return user; // Return the user object
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }

    async getUserById(id) {
        try {
            // Ensure that the connection is established
            if (!this.knex) {
                throw new Error('Connection not established. Call connect() first.');
            }

            // Query the database for the user with the given email
            const user = await this.knex('Users').where('user_id', id).first();

            return user; // Return the user object
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }

    async createUser(firstName, lastName, email, sub) {
        try {
            // Ensure that the connection is established
            if (!this.knex) {
                throw new Error('Connection not established. Call connect() first.');
            }
    
            // Insert the user into the database
            const [userId] = await this.knex('Users').insert({
                first_name: firstName,
                last_name: lastName,
                email: email,
                sub: sub // Save the 'sub' identifier
            });
    
            return userId; // Return the ID of the newly created user
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }

    async deleteUser(userId) {
        try {
            // Execute the delete operation using Knex.js
            const deletedCount = await this.knex('Users')
                .where({ user_id: userId })
                .del();
    
            if (deletedCount === 0) {
                // Handle case where user was not found
                throw new Error('User not found');
            }
    
            // User successfully deleted
            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            // Handle any errors that occurred during the deletion process
            console.error('Error deleting user:', error);
            throw error; // Rethrow the error to be handled by the caller
        }
    }
    
    async getAllUsers() {
        try {
            // Assuming you have a 'Users' table in your database
            const users = await this.knex('Users').select('*');
            return users;
        } catch (error) {
            throw error;
        }
    }

    async updateUserById(userId, updateFields) {
        try {
            if (!this.knex) {
                throw new Error('connection not established, call connect() first');
            }

            await this.knex('Users')
                .where('user_id', userId)
                .update(updateFields);

            console.log('user updated successfully');
        } catch (err) {
            throw err;
        }
    }

    async makeUserAdmin(userId) {
        try {
            // Assuming you have a method to update the user's isAdmin status in your database
            await this.updateUserById(userId, { isAdmin: true });
            
            // Return a success message or handle the result as needed
            return 'User has been made an admin successfully.';
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error making user admin:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }

    async removeUserAdmin(userId) {
        try {
            // Assuming you have a method to update the user's isAdmin status in your database
            await this.updateUserById(userId, { isAdmin: false });
            
            // Return a success message or handle the result as needed
            return 'User has been made an admin successfully.';
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error making user admin:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }
    

}

const db = new CageDB();

module.exports = db;