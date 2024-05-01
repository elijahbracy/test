require('dotenv').config();
const knex = require('./config/knexfile');
const fs = require('fs');
const assert = require('assert');
const { promisify } = require('util');
const { readyException } = require('jquery');
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
    
    
        console.log('Database initialization complete');
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }
    

    async getUserByEmail(email) {
        try {
            // Query the database for the user with the given email
            const user = await knex('Users').where('email', '=', email).first();
    
            return user; // Return the user object
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }
    

    async getUserById(id) {
        try {
            // Query the database for the user with the given ID
            const user = await knex('Users').where('user_id', id).first();
    
            return user; // Return the user object
        } catch (error) {
            throw error; // Throw any errors encountered
        }
    }
    
    async createUser(firstName, lastName, email, sub) {
        try {
            // Insert the user into the database
            const userId = await knex('Users').insert({
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
            const deletedCount = await knex('Users')
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
            const users = await knex('Users').select('*');
            return users;
        } catch (error) {
            throw error;
        }
    }
    

    async updateUserById(userId, updateFields) {
        try {
            // Update the user information in the database
            await knex('Users')
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
            await this.updateUserById(userId, { role: "admin" });
            
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
            const equipment = await knex('Equipment').select('*');
            return equipment; // Return the equipment data
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error getting equipment:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }

    async addEquipment(name, quantity) {
        try {
            // Insert a new equipment record into the database
            const result = await knex('Equipment')
                .returning('equipment_id')
                .insert({
                name: name,
                quantity: quantity
            });
            console.log('result', result);
            return result[0].equipment_id; // Return the newly inserted equipment data
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error adding equipment:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }

    async addAvailability(equipment_id, quantity) {
        try {
            await knex('Availability').insert({
                equipment_id: equipment_id,
                available_quantity: quantity
            });
        } catch (error) {
            // Handle any errors that occur during the database operation
            console.error('Error adding equipment availability:', error);
            throw error; // Rethrow the error to be handled by the calling function
        }
    }

    async deleteEquipment(id) {
        try {
            // Assuming 'knex' is your Knex.js instance
            await knex('Equipment').where('equipment_id', id).del();
            console.log(`Equipment with ID ${id} deleted successfully`);
            // Optionally, you can return a success message or status code
            return { success: true, message: `Equipment with ID ${id} deleted successfully` };
        } catch (error) {
            console.error('Error deleting equipment:', error);
            // Optionally, you can throw the error to be handled by the caller
            throw error;
        }
    }

    async getAvailability(equipment_id) {
        try {
            const availability = await knex('Availability')
                .select('available_quantity', 'available_date')
                .where('equipment_id', equipment_id);

            return availability;
        }catch (error) {
            console.error('Error retrieving availability:', error);
            // Optionally, you can throw the error to be handled by the caller
            throw error;
        }
    }
    
    async insertRental(user_id, startDate, endDate, notes, course) {
        try {
            const [rental_id] = await knex('Rentals')
                .returning('rental_id')
                .insert({
                user_id: user_id,
                rental_start_date: startDate,
                rental_end_date: endDate,
                rental_status: 'pending',
                notes: notes,
                course: course
            });
            return rental_id;
        } catch (err) {
            throw err;
        }
    }

    async insertRentalEquipment(rental_id, equipment_id) {
        try {
            const result = await knex('RentalEquipment').insert({
                rental_id: rental_id,
                equipment_id: equipment_id
            });
        } catch (err) {
            throw err;
        }
    }

    async getRentalsByUser(user_id) {
        try {
            const rentals = await knex('Rentals')
                .select('*')
                .where('user_id', user_id);
            return rentals;
        } catch {
            console.error('Error retrieving rentals:', error);
            throw error; // Rethrow the error to the caller
        }
    }

    async getEquipmentByRental(rental_id) {
        try {
            const equipment = await knex('RentalEquipment')
                .select('Equipment.name')
                .join('Equipment', 'RentalEquipment.equipment_id', 'Equipment.equipment_id')
                .where('RentalEquipment.rental_id', rental_id);
            return equipment.map(e => e.name);
        } catch (error){
            console.error('Error retrieving equipment:', error);
            throw error; // Rethrow the error to the caller
        }
    }

    async getRentalsDueToday() {
        try {
            const today = new Date();
            const rentals = await knex('Rentals')
                .select('Rentals.*', 'Users.*')
                .join('Users', 'Rentals.user_id', 'Users.user_id')
                .where('rental_end_date', today.toISOString());
                // Do something with the rentals due today
            console.log(rentals);
            return rentals;
        } catch (err) {
            console.error("Error retrieving rentals due today:", err);
            throw err;
        }
    }

    async getAllRentals() {
        try {
            const rentals = await knex('Rentals')
                .select('Rentals.*', 'Users.first_name', 'Users.last_name')
                .innerJoin('Users', 'Rentals.user_id', 'Users.user_id')
            return rentals;
        } catch (err) {
            console.error('Error retrieving rentals:', err);
            throw err; // Rethrow the error to the caller
        }
    }

    async getRentals(offset, pageSize) {
        try {
            const rentals = await knex('Rentals')
                .select('Rentals.*', 'Users.first_name', 'Users.last_name')
                .orderBy('rental_id', 'desc')
                .innerJoin('Users', 'Rentals.user_id', 'Users.user_id')
                .offset(offset)
                .limit(pageSize);
    
            return rentals;
        } catch (err) {
            console.error('Error retrieving rentals:', err);
            throw err; // Rethrow the error to the caller
        }
    }

    async updateRental(rental_id, start_date, end_date, equipment, status, notes, course) {
        try {

            console.log('rentalID:', rental_id);
            // Update rental information in the rentals table
            await knex('Rentals')
                .where({ rental_id })
                .update({ rental_start_date: start_date, rental_end_date: end_date, rental_status: status, notes: notes, course: course });
    
            // Update rental equipment in the rentalEquipment table
            // First, delete all existing entries for the rental
            await knex('RentalEquipment')
                .where({ rental_id })
                .del();
    
            // Then, insert the updated equipment list
            const equipmentIds = equipment; // Assuming equipment is an array of equipment IDs
            await knex('RentalEquipment').insert(equipmentIds.map(equipment_id => ({ rental_id, equipment_id })));
    
            return true; // Return true if the update was successful
        } catch (error) {
            console.error('Error updating rental:', error);
            throw error;
        }
    }

    async getRentalById(rental_id) {
        try {
            const rental = await knex('Rentals')
                .select('*')
                .where('Rentals.rental_id', rental_id);
            return rental[0];
        } catch (err) {
            console.error('Error retrieving rentals:', err);
            throw err; // Rethrow the error to the caller
        }
    }

}

const db = new CageDB();
db.initialize();

module.exports = db;