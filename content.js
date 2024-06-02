let disableMouseupListener = false;

// Function to inject CSS styles directly into the page
function injectCSS() {
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

      .highlight-overlay {
        position: absolute;
        z-index: 9999;
        display: none;
      }
  
      .highlight-explainer-popup {
        position: absolute;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        width: 300px;
        height: 200px;
        overflow-y: auto;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        line-height: 1.4;
        z-index: 10000;
      }
  
      .highlight-explainer-popup .close-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: #f5f5f5;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        text-align: center;
        line-height: 20px;
        font-size: 14px;
        cursor: pointer;
        color: #333;
      }
  
      .highlight-explainer-popup .close-btn:hover {
        background-color: #e0e0e0;
      }
  
      .highlight-explainer-popup p {
        margin: 0;
        padding: 0;
      }
  
      .explain-button {
        background-color: #3394ff; /* Lighter shade of Scale's button color */        
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 20px; /* Adjust padding to match Scale's button */
        cursor: pointer;
        font-size: 14px; /* Match font size */
        // font-weight: bold; /* Match font weight */
        text-align: center;
        text-decoration: none; /* Remove underline */
        display: inline-block;
        z-index: 10001; /* Ensure button is above other elements */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Add a subtle shadow */
        transition: background-color 0.2s ease, box-shadow 0.3s ease; /* Add transition effects */
      }
  
      .explain-button:hover {
        background-color: #005bb5; /* Darken on hover */
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Enhance shadow on hover */
      }
  
      .explain-button:active {
        background-color: #003f7f; /* Further darken on click */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Reduce shadow on click */
      }
    `;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}

// Inject the CSS when the content script runs
injectCSS();

// Function to remove the explain button
function removeExistingButton() {
    const existingButton = document.querySelector('.explain-button');
    if (existingButton) {
        existingButton.remove();
    }
}

// Function to show the explain button
function showExplainButton(rect, text) {
    // Remove any existing explain button
    removeExistingButton();

    // Create the "Explain" button
    const button = document.createElement('button');
    button.className = 'explain-button';
    button.textContent = 'explain';

    // Style the button (position it near the selected text)
    button.style.position = 'absolute';
    button.style.top = `${rect.top + window.scrollY}px`;
    button.style.left = `${rect.right + window.scrollX + 10}px`;

    // Append the button to the body
    document.body.appendChild(button);

    // Add click event listener to the button
    button.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click event from bubbling up
        console.log('Explain button clicked');
        button.remove(); // Remove the button
        showOverlay(rect);
        getExplanation(text);
    });

    // Delay the addition of the document's click listener
    setTimeout(() => {
        document.addEventListener('click', function handleOutsideClick(event) {
            if (!button.contains(event.target)) {
                console.log('Clicked outside explain button, removing button');
                button.remove();
                document.removeEventListener('click', handleOutsideClick);
            }
        }, { once: true });
    }, 100);
}

// Function to show the overlay and popup
function showOverlay(rect) {
    console.log('Showing overlay at:', rect);

    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.highlight-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'highlight-overlay';
        document.body.appendChild(overlay);
    }

    // Create popup if it doesn't exist
    let popup = document.querySelector('.highlight-explainer-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'highlight-explainer-popup';
        popup.innerHTML = `
        <button class="close-btn">&times;</button>
        <p class="popup-content"></p>
      `;
        document.body.appendChild(popup);
    }

    // Reset popup content
    const popupContent = popup.querySelector('.popup-content');
    popupContent.textContent = '';

    // Set fixed size for the popup
    const popupWidth = 300; // Fixed width
    const popupHeight = 200; // Fixed height
    let top = rect.top + window.scrollY - popupHeight - 10; // Position above the highlighted text
    let left = rect.right + window.scrollX + 10; // Position to the right of the highlighted text

    // Adjust positioning if the popup goes beyond the viewport
    if (left + popupWidth > window.innerWidth) {
        left = rect.left + window.scrollX - popupWidth - 10;
    }
    if (top < 0) {
        top = rect.bottom + window.scrollY + 10; // Position below the highlighted text if there's no space above
    }

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;

    // Ensure overlay covers only the popup area
    overlay.style.position = 'absolute';
    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;
    overlay.style.width = `${popupWidth}px`;
    overlay.style.height = `${popupHeight}px`;
    overlay.style.display = 'block';
    overlay.style.background = 'transparent'; // Ensure overlay is transparent

    console.log('Overlay and popup appended to document');

    // Add event listener to close the popup
    popup.querySelector('.close-btn').addEventListener('click', () => {
        console.log('Popup close button clicked');
        overlay.style.display = 'none';
        popup.remove();
    });

    // Remove popup when user clicks anywhere outside the popup
    document.addEventListener('click', function handleOutsideClick(event) {
        if (!popup.contains(event.target)) {
            console.log('Clicked outside popup, removing popup');
            overlay.style.display = 'none';
            popup.remove();
            document.removeEventListener('click', handleOutsideClick);
        }
    }, { once: true });
}

// Function to update the popup with text
function updatePopup(text) {
    console.log('Updating popup with text:', text);
    const popupContent = document.querySelector('.highlight-explainer-popup .popup-content');
    if (popupContent) {
        popupContent.textContent += text; // Append new text to existing content
        console.log('Popup updated with text');
    } else {
        console.log('Popup element not found');
    }
}

// Function to get the explanation of the selected text
function getExplanation(text) {
    console.log('Sending message to background script:', text);

    // Message Passing: opens channel and sends and listens for messages from background.js
    var port = chrome.runtime.connect({ name: "textMessage" });
    port.postMessage({ inputText: text })
    port.onMessage.addListener(function (msg) {
        console.log('Response from background script:', msg)
        if (msg.partialText) {
            console.log('Received partial text:', msg.partialText)
            updatePopup(msg.partialText)
        } else if (msg.complete) {
            console.log('Streaming complete');
        } else {
            console.error('Error:', msg.error)
        }
    })

}

// chrome.runtime.sendMessage({ text }, (response) => {
//     console.log('Response from background script:', response); // Added log
//     if (chrome.runtime.lastError) {
//         console.error('Error:', chrome.runtime.lastError);
//     } else if (response && response.explanation) {
//         console.log('Received final explanation:', response.explanation);
//         updatePopup(response.explanation);
//     } else {
//         console.error('No response or explanation found');
//     }
// });

// chrome.runtime.onMessage.addListener(function handleStream(message) {
//     if (message.partialText) {
//         console.log('Received partial text:', message.partialText);
//         updatePopup(msg.partialText);
//     } else if (message.complete) {
//         console.log('Streaming complete');
//     } else if (message.error) {
//         console.error('Error:', message.error);
//     }
// });

// Listen for mouseup event to show the explain button
document.addEventListener('mouseup', async (event) => {
    if (disableMouseupListener) return;

    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        console.log('Selected text:', selectedText);
        const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
        setTimeout(() => showExplainButton(rect, selectedText), 50); // Add a slight delay
    } else {
        removeExistingButton();
    }
});

// Listen for click event to remove the explain button when clicking outside
document.addEventListener('click', (event) => {
    const button = document.querySelector('.explain-button');
    if (button && !button.contains(event.target)) {
        console.log('Clicked outside explain button, removing button');
        button.remove();
    }
});
