// require('dotenv').config();

// responding to incoming connections
chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name === "textMessage");
    port.onMessage.addListener(function (msg) {
        if (msg.inputText) {
            console.log('Received text for explanation:', msg.inputText);
            fetchExplanation(msg.inputText, port);
        }
    })
})

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log('Received a message in background script:', request); // Added log

//     if (request.text) {
//         console.log('Received text for explanation:', request.text);
//         fetchExplanation(request.text);
//         return true; // Indicate that we will send a response asynchronously.
//     }
// });

// Define an asynchronous function to fetch an explanation for a given text.
async function fetchExplanation(text, port) {
    try {
        // const API_KEY = process.env.OPENAI_API_KEY;
        console.log('Fetching explanation for:', text);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer PLACEHOLDER_API_KEY`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: `Explain the following text: ${text}` }
                ],
                stream: true
            })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            console.error('API request failed:', errorMessage);
            throw new Error(`API request failed with status ${response.status}: ${errorMessage}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let partialText = '';

        const processText = async ({ done, value }) => {
            if (done) {
                console.log('Stream complete');
                port.postMessage({ complete: true });
                return;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: ')).map(line => line.trim().slice('data: '.length));

            for (const line of lines) {
                if (line === '[DONE]') {
                    console.log('Stream finished');
                    port.postMessage({ complete: true });
                    return;
                }

                const json = JSON.parse(line);
                if (json.choices && json.choices.length > 0 && json.choices[0].delta && json.choices[0].delta.content) {
                    partialText += json.choices[0].delta.content;
                    console.log('Partial text received:', partialText);
                    port.postMessage({ partialText });
                    partialText = '';
                }
            }

            reader.read().then(processText);
        };

        reader.read().then(processText);

    } catch (error) {
        console.error('Error in fetchExplanation:', error.message);
        port.postMessage({ error: error.message });
    }
}
