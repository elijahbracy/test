

class UserModel {
    constructor(knex) {
        this.knex = knex;
    }

    static async createUser(firstName, lastName, email) {
        // Insert the user into the database
        const [userId] = await this.knex('Users').insert({
            first_name: firstName,
            last_name: lastName,
            email: email
        });

        return userId;
    }

    static async getUserByEmail(email) {
        // Find the user by email
        const user = await this.knex('Users').where({ email }).first();
        return user;
    }

    // Add more methods as needed for user operations
}

module.exports = UserModel;
