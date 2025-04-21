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
1. Add support for Attachments (use Paperclip button to attach files)
2. Add a cancel button, to stop the audio output/playback
3. Implement interruption via audio, similar to cancel button
4. Implement a Microphone in the text area to add some text via Audio, but have the option to edit it before sending
5. Implement visualization of an Avatar with Lipsync by using https://github.com/Rudrabha/Wav2Lip
6. Add support to select different tools retrieved from an MCP server
    1. Implement MCP server: 
        1. Implement Mem0: https://www.youtube.com/watch?v=lbyPJqCI-tw
        2. Implement LightRAG: https://www.youtube.com/watch?v=Fx3J8k--U3E
    2. Integrate n8n (via MCP server): https://www.youtube.com/watch?v=WcIRVk8kyJk
   