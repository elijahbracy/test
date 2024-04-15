require('dotenv').config();
const knex = require('./config/dbConfig');
const fs = require('fs');
const assert = require('assert');
const { promisify } = require('util');
//const UserModel = require('./models/userModel');



class CageDB {

    async initialize() {
        try {
            // Check if tables exist and create them if necessary
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
            const [result] = await knex.raw(`
                SELECT 1 
                FROM information_schema.triggers 
                WHERE trigger_name = '${triggerName}'`
            );
            return !!result;
        }

        
        const availabilityDecrementTrigger = await checkTriggerExists('decrement_availability_insert');

        if (!availabilityDecrementTrigger) {
            await knex.raw(`
                CREATE OR REPLACE FUNCTION decrement_availability_trigger_function()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF TG_OP = 'INSERT' THEN
                        IF NEW.rental_status = 'approved' OR NEW.rental_status = 'in progress' THEN
                            UPDATE "Availability" 
                            SET available_quantity = available_quantity - 1
                            WHERE equipment_id = NEW.equipment_id;
                        END IF;
                    ELSIF TG_OP = 'UPDATE' THEN
                        IF NEW.rental_status = 'approved' AND OLD.rental_status <> 'approved' THEN
                            UPDATE "Availability" 
                            SET available_quantity = available_quantity - 1
                            WHERE equipment_id = NEW.equipment_id;
                        ELSIF NEW.rental_status = 'in progress' AND OLD.rental_status <> 'in progress' THEN
                            UPDATE "Availability" 
                            SET available_quantity = available_quantity - 1
                            WHERE equipment_id = NEW.equipment_id;
                        END IF;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
        
                CREATE TRIGGER decrement_availability_trigger
                BEFORE INSERT OR UPDATE ON "RentalEquipment"
                FOR EACH ROW
                EXECUTE FUNCTION decrement_availability_trigger_function();
            `);
        }
        
            // Repeat the above steps for other triggers: decrement_availability_update
    
            console.log('Database initialization complete');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }
    

    async getUserByEmail(email) {
        try {
            // Query the database for the user with the given email
            const user = await this.knex('Users').where('email', '=', email).first();
    
            return user; // Return the user object
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }
    

    async getUserById(id) {
        try {
            // Query the database for the user with the given ID
            const user = await this.knex('Users').where('user_id', id).first();
    
            return user; // Return the user object
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }
    
    async createUser(firstName, lastName, email, sub) {
        try {
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
            // Retrieve all users from the 'Users' table
            const users = await this.knex('Users').select('*');
            return users;
        } catch (error) {
            throw error;
        }
    }
    

    async updateUserById(userId, updateFields) {
        try {
            // Update the user information in the database
            await this.knex('Users')
                .where('user_id', userId)
                .update(updateFields);
    
            console.log('User updated successfully');
        } catch (err) {
            throw err;
        }
    }
    

    async makeUserAdmin(userId) {
        try {
            // Update the user's isAdmin status to true
            await this.updateUserById(userId, { isAdmin: true });
            
            // Return a success message or handle the result as needed
            return 'User has been made an admin successfully.';
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error making user admin:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }
    

    async getEquipment() {
        try {
            // Query the database to get all equipment records
            const equipment = await this.knex('Equipment').select('*');
            return equipment; // Return the equipment data
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error getting equipment:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }
    
    

}

const db = new CageDB();
db.initialize();

module.exports = db;