async function test() {
    try {
        console.log("Testing 'Who is the CEO?'...");
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Who is the CEO of ProWoo?" })
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);

        console.log("\nTesting 'Who is Shilpa?'...");
        const response2 = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Who is Shilpa?" })
        });
        const text2 = await response2.text();
        console.log("Status:", response2.status);
        console.log("Body:", text2);

    } catch (e) {
        console.error(e);
    }
}
test();
