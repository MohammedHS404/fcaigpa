document.getElementById('calculateGPA').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                function: calculateGPAFromPage
            },
            (results) => {
                if (results && results[0] && results[0].result) {
                    const { cumulativeGPA, totalHours } = results[0].result;
                    document.getElementById('gpaResult').innerText = `Cumulative GPA: ${cumulativeGPA.toFixed(4)}`;
                    document.getElementById('hoursResult').innerText = `Total Hours: ${totalHours}`;
                }
            }
        );
    });
});

function calculateGPAFromPage() {
    // Grading scale according to the provided image
    const gradeToPoints = {
        "A+": 4.0,
        "A": 3.7,
        "B+": 3.3,
        "B": 3.0,
        "C+": 2.7,
        "C": 2.4,
        "D+": 2.3,
        "D": 2.0,
        "F": 0.0
    };

    // Function to calculate GPA for a single subject
    function calculateGPA(subject) {
        const grade = subject["Grade"];
        const hours = parseFloat(subject["Hours"]);
        const points = gradeToPoints[grade] || 0.0;
        return {
            gpa: points,
            weightedPoints: points * hours,
            creditHours: hours
        };
    }

    // Function to calculate cumulative GPA for multiple subjects
    function calculateCumulativeGPA(subjects) {
        let totalWeightedPoints = 0;
        let totalCreditHours = 0;

        subjects.forEach(subject => {
            const { weightedPoints, creditHours } = calculateGPA(subject);
            totalWeightedPoints += weightedPoints;
            totalCreditHours += creditHours;
        });

        const cumulativeGPA = totalWeightedPoints / totalCreditHours;
        return { cumulativeGPA, totalCreditHours };
    }

    // Select the header row and the table rows
    const headerRow = document.querySelectorAll(".table thead th");
    const rows = document.querySelectorAll(".table.table-striped tr");

    // Extract header values
    const headers = [...headerRow].map(header => header.innerText);

    // Map and filter the rows
    const subjects = [...rows]
        .map(row => [...row.querySelectorAll("td")])
        .map(cells => {
            // Create an object with keys from headers and values from cells
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = cells[index]?.innerText || null;
            });
            return obj;
        })
        .filter(subject => subject.Hours)
        .filter(subject => subject.Hours !== '0')
        .filter(subject => subject.Grade !== 'F');

    const totalHours = subjects.reduce((prev, current) => prev + parseInt(current.Hours), 0);

    // Calculate and return cumulative GPA
    const { cumulativeGPA } = calculateCumulativeGPA(subjects);
    return { cumulativeGPA, totalHours };
}
