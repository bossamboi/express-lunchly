"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
	constructor({ id, firstName, lastName, phone, notes }) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
		this.notes = notes;
	}

  /** format custoemr full name */

	fullName() {
		return `${this.firstName} ${this.lastName}`;
	}

	/** find all customers. */

	static async all() {
		const results = await db.query(
			`SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`
		);
		return results.rows.map((c) => new Customer(c));
	}
	/** find all customers by first or last name */
	static async filterBySearch(searchTerm){
		let results = await db.query(
			`SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
		   WHERE first_name || ' ' || last_name ILIKE $1
           ORDER BY last_name, first_name`, [`%${searchTerm}%`]
		);
		return results.rows.map((c) => new Customer(c));
	}
	/** find top ten customers with the most reservations */
	static async getTopTen(){
		console.log("GETTING TOP TEN")
		let results = await db.query(
			`SELECT r.customer_id, 
					c.first_name as "firstName",
					c.last_name as "lastName", 
					c.phone, 
					c.notes
			 FROM reservations AS r
			 JOIN customers AS c
			 ON r.customer_id = c.id
			 GROUP BY r.customer_id, 
			 		  c.first_name, 
					   c.last_name, 
					   c.phone, 
					   c.notes
			 ORDER BY COUNT(*) DESC 
			 LIMIT 10;`
		);
		console.log(results, "<<<<<<<<<HERE ARE THE RESULTS>>>>>>>>>>>>")
		return results.rows.map((c) => new Customer(c));
	}

	/** find one customer */
	static async get(id) {
		const results = await db.query(
			`SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
			[id]
		);

		const customer = results.rows[0];

		if (customer === undefined) {
			const err = new Error(`No such customer: ${id}`);
			err.status = 404;
			throw err;
		}

		return new Customer(customer);
	}

	/** get all reservations for this customer. */

	async getReservations() {
		return await Reservation.getReservationsForCustomer(this.id);
	}

	/** save this customer. */

	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
				[this.firstName, this.lastName, this.phone, this.notes]
			);
			this.id = result.rows[0].id;
		} else {
			await db.query(
				`UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`,
				[this.firstName, this.lastName, this.phone, this.notes, this.id]
			);
		}
	}
}

module.exports = Customer;
