# AI Agent Frontend

This is the Frontend for my AI Agent Backend (see other project). You can talk and screenshare to the AI, which makes it very efficient to solve any kind of computer problems. It uses WebSocket communication for low latency and streaming. It is written in Svelte 5 and Typescript.

![AI Agent Frontend Screenshot](Screenshot.png)

## Features

- Talking to AI (audio)
- Screensharing to AI 

## Prerequisites

- Node.js (v16 or higher)
- npm
- Modern web browser with screen sharing support
- AI Agent Backend

## Setup
1. Clone the repository    
    ```
    git clone https://github.com/feifel/AiAgentFrontend.git
    cd AiAgentFrontend
    ```    
2. Install dependencies    
    ```
    npm install
    ```    
3. Set up the websocket server url. Open the App.tsx and find the line:    
    ```
     <WebSocketProvider url="ws://your-websocket-server-url">
    ```    
    Replace the websocket server url with 
    [localhost:9073](http://localhost:9073). 
    The port should be the one that your AI Agent Backend is running 
    (see other project).    
4. Run the development server    
    ```
    npm run dev
    ```    
5. Open [http://localhost:5173](http://localhost:5173/) with your browser to see the application.

## Credits
This project was heavily inspired by https://github.com/yeyu2/multimodal-client-vite

## Roadmap
1. Implement a proper chat history
2. Add a toolbar in a separate Svelte 5 app 
    1. Add a dropdown list to select the LLM (gemma-3, Qwen2.5, llama, etc.)
    2. Add a dropdown to select the language
    3. Add the following toggle buttons to show additional outout in a modal window (only one at a time or none):
        1. Screensharing to show the shared screen
        2. Talking Avatar to show a talking avatar with lipsync
    4. Add the following toggle buttons to select the input:
        1. Headset, to select audio input (shows the current audio level in a bar below the toolbar)
        2. Keyboard, to select keyboard input (shows a text area with a send button)
        3. Paperclip, to attach files
    5. Add a cancel button, to stop the audio output/playback
3. Implement a text area, so that the user can send text messages to the LLM
    1. Implement a Send Button
    2. Implement a Microphone to add some text via Audio first