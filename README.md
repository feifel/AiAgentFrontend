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
3. Set up the websocket server url. Open the src/App.svelte and find the line:    
    ```
     wsService.set(new WebSocketService('ws://localhost:9073'));
    ```    
    Replace the websocket server port with the port your AI Agent Backend is running on (see other project).    
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
   

## Similar projects
1. https://github.com/TEN-framework/TEN-Agent