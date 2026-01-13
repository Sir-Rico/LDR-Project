import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

//Static HTML pages
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/services", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "services.html"));
});

app.get("/loans", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "loans.html"));
});

app.get("/about", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/contact", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// Dynamic Loan page
// app.get("/loans", (req, res) => {
// 	res.render("loans.ejs");
// });

//Loan Calculator
app.post("/calculate", (req, res) => {
	let loan_amount = Number(req.body.amount);

	if (!loan_amount || loan_amount <= 0) {
		return res.render("loans.ejs", {
			error: "Please enter a valid loan amount.",
		});
	}

	let total_repayment = (0.176 * loan_amount + loan_amount).toFixed(0);
	let daily_repayment = (total_repayment / 48).toFixed(0);

	res.render("loans.ejs", {
		repayment: daily_repayment,
		total: total_repayment,
	});
});

// var userIsAuthorised = false;
// function logger(req, res, next) {
// 	let password = req.body["password"];
// 	if (password === "123") {
// 		userIsAuthorised = true;
// 	}
// 	next();
// }

// app.use(logger);

// app.get("/login.html", (req, res) => {
// 	res.sendFile(__dirname + "/public/login.html");
// });

// app.post("/check", (req, res) => {
// 	if (userIsAuthorised) {
// 		res.sendFile(__dirname + "/public/dashboard.html");
// 	} else {
// 		res.redirect("/login.html");
// 	}
// console.log(req.body["password"]);
// 	console.log(userIsAuthorised);
// });

//MOTHLY LOAN CALCULATOR
app.post("/api/calculate-schedule", (req, res) => {	
    const P = Number(req.body.amount)
	const n = Number(req.body.tenor);
	const i = 0.1; // 10% monthly interest

	// SECURITY VALIDATIONS
	if (!P || P <= 0) {
		return res.json({ error: "Invalid amount" });
	}

	if (P < 5000) {
		return res.json({ error: "Minimum loan amount is ₦5,000." });
	}

	if (P > 100000000) {
		return res.json({ error: "Maximum loan amount is ₦100,000,000." });
	}

	if (!n || n <= 0) {
		return res.json({ error: "Invalid tenor" });
	}

    if (n > 12) {
		return res.json({ error: "Maximum loan tenor is 12 months." });
	}

	// Monthly payment using amortization formula
	const PMT = (P * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);

	let balance = P;
	let totalInterest = 0;
    let totalPayment = 0;

	const schedule = [];

	for (let month = 1; month <= n; month++) {
		const interest = balance * i;
		const capital = PMT - interest;
		balance -= capital;
		totalInterest += interest;
        totalPayment += PMT;

		schedule.push({
			month,
			interest,
			capital,
			payment: PMT,
			balance: balance < 0 ? 0 : balance,
		});
	}

	res.json({ schedule, summary: {
		totalInterest,
		totalPayment
	} });
});

//DAILY LOAN CALCULATOR
app.post("/api/calculate", (req, res) => {
	const amount = Number(req.body.amount);

	// SECURITY VALIDATIONS
	if (!amount || isNaN(amount)) {
		return res.json({ error: "Invalid loan amount." });
	}

	if (amount < 5000) {
		return res.json({ error: "Minimum loan amount is ₦5,000." });
	}

	if (amount > 100000000) {
		return res.json({ error: "Maximum loan amount is ₦100,000,000." });
	}

	// OFFICIAL SERVER CALCULATION (cannot be tampered)
	const daily = (0.176 * amount + amount) / 48;
	const total = daily * 48;
	const interest = total - amount;

	res.json({
		repayment: daily.toFixed(2),
		total: total.toFixed(2),
		interest: interest.toFixed(2),
	});
});

// EMAIL HANDLER
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: "enreaco@gmail.com",
		pass: "jtck qghm fdok mwtn",
	},
});

app.post("/contact", async (req, res) => {
	const { name, email, number, message } = req.body;

	if (!name || !email || !number || !message) {
		return res.status(400).send("All fields are required");
	}

	try {
		await transporter.sendMail({
			from: `"Website Contact Form" <yourgmail@gmail.com>`,
			to: "enreaco@gmail.com",
			subject: "New Contact Form Submission",
			html: `
                <h3>New Message from Website</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Number:</strong> ${number}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
		});

		// Optional auto-reply
		await transporter.sendMail({
			from: `"Finance Company" <@gmail.com>`,
			to: email,
			subject: "We received your message",
			html: `
                <p>Hello ${name},</p>
                <p>Thank you for reaching out to Finance Company.</p>
                <p>We will respond shortly.</p>
            `,
		});

		res.send("Message sent");
	} catch (err) {
		console.error(err);
		res.status(500).send("Failed to send email");
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
});
