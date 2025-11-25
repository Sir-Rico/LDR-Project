function renderSchedule(schedule, summary) {
    const tbody = document.querySelector("#scheduleTable tbody");
    tbody.innerHTML = "";

    schedule.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td data-label="Month: ">${item.month}</td>
            <td data-label="Interest: ">₦${item.interest.toLocaleString()}</td>
            <td data-label="Capital: ">₦${item.capital.toLocaleString()}</td>
            <td data-label="Payment: ">₦${item.payment.toLocaleString()}</td>
            <td data-label="Balance: ">₦${item.balance.toLocaleString()}</td>
        `;

        tbody.appendChild(row);
    });

    // TOTAL row
    const totalRow = document.createElement("tr");
    totalRow.classList.add("total-row");

    totalRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td data-label="Interest: "><strong>₦${summary.totalInterest.toLocaleString()}</strong></td>
        <td>—</td>
        <td data-label="Payment: "><strong>₦${summary.totalPayment.toLocaleString()}</strong></td>
        <td>—</td>
    `;

    tbody.appendChild(totalRow);
}


//MONTHLY LOAN CALCULATOR
document
	.getElementById("monthlyCalculateButton")
	.addEventListener("click", async (e) => {
		e.preventDefault();

		const amountRaw = document.getElementById("monthlyLoanAmount").value;
		const amount = Number(amountRaw.replace(/,/g, ""));
		const tenorRaw = document.getElementById("loanTenor").value;
		const tenor = Number(tenorRaw.replace(/,/g, ""));

		const response = await fetch("/api/calculate-schedule", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ amount, tenor }),
		});

		const data = await response.json();

		if (data.error) {
			alert(data.error);
			return;
		}

		// Fill table
		renderSchedule(data.schedule, {
			totalInterest: data.summary.totalInterest,
			totalPayment: data.summary.totalPayment
		});

		document.getElementById("schedule").classList.remove("hidden");
	});

//DAILY LOAN CALCULATOR
document
	.getElementById("dailyCalculateButton")
	.addEventListener("click", async (e) => {
		e.preventDefault();

		const amountRaw = document.getElementById("loanAmount").value;
		const amount = Number(amountRaw.replace(/,/g, ""));

		const response = await fetch("/api/calculate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ amount }),
		});

		const data = await response.json();

		if (data.error) {
			alert(data.error);
			return;
		}

		document.getElementById("daily").textContent = Number(
			data.repayment
		).toLocaleString("en-US");

		document.getElementById("total").textContent = Number(
			data.total
		).toLocaleString("en-US");

		document.getElementById("interest").textContent = Number(
			data.interest
		).toLocaleString("en-US");

		document.getElementById("results").classList.remove("hidden");
	});
