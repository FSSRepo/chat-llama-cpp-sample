const express = require('express');
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
    socket.on("disconnect", (reason) => {

    });
});

let vicuna_mode = {
    chat_prompt: [
        { user: "Hello, Assistant.",
          assistant: "Hello. How may I help you today?"  },
        { user: "Please tell me the largest city in Europe.",
          assistant: "Sure. The largest city in Europe is Moscow, the capital of Russia." }
    ],
    gen_prompt: (user_req) => {
        let prompt = "A chat between a curious human and an artificial intelligence assistant. " +
        "The assistant gives helpful, detailed, and polite answers to the human's questions.\n\n";
        prompt += vicuna_mode.chat_prompt.map(chat => '### Human: '  + chat.user + '\n### Assistant: '  + chat.assistant).join('\n');
        prompt += chat_context.map(chat => '### Human: '  + chat.user + '\n### Assistant: '  + chat.assistant).join('\n');
        prompt += '### Human: '  + user_req + '\n### Assistant:';
        return prompt;
    },
    stop_words: ["### Human:"],
}

let chat_context = [];

app.use(cors());

app.use(express.json());
app.use(express.static('./public'));

app.post('/send',async (req, res) => {
    const question = req.body.text;
    let message_result = '';
    let result = await axios.post("http://127.0.0.1:8080/completion", {
      prompt: vicuna_mode.gen_prompt(question),
      temperature: 0.2,
      top_k: 40,
      top_p: 0.9,
      n_keep: 29,
      n_predict: 512,
      stop: vicuna_mode.stop_words, // when detect this, stop completion
      stream: true,
    }, {
      responseType: 'stream'
    });
    result.data.on('data', (chunk) => {
      const t = Buffer.from(chunk).toString("utf8");
      if (t.startsWith("data: ")) {
        const completion = JSON.parse(t.substring(6));
        io.to(req.body.socket_id).emit("message-stream", completion.content);
        message_result += completion.content;
        if (completion.stop) {
          io.to(req.body.socket_id).emit("message-stream", "stop-chat");
          chat_context.push({ user: completion.content, assistant: message_result });
        }
      }
    })
    res.send({});
});

app.get('/reset',async (req, res) => {
  chat_context = [];
    console.log("Context cleanup");
    res.send({ status: "done" });
});

server.listen(2400, () => {
    console.log("Chat LlaMA is listening");
});