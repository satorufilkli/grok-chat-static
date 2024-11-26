const apiKeyInput = document.getElementById("api-key-input");
const saveKeyButton = document.getElementById("save-key-button");
const chatContainer = document.getElementById("chat-container");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

const savedApiKey = localStorage.getItem("apiKey");
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

saveKeyButton.addEventListener("click", () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem("apiKey", apiKey);
    alert("API Key 已保存");
  }
});

function addMessage(content, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;
  messageDiv.textContent = content;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const message = messageInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!message) return;
  if (!apiKey) {
    alert("请先输入 API Key");
    return;
  }

  addMessage(message, true);
  messageInput.value = "";

  const aiMessageDiv = document.createElement("div");
  aiMessageDiv.className = "message ai-message";
  chatContainer.appendChild(aiMessageDiv);

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        model: "grok-beta",
        stream: true,
        temperature: 0,
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") break;

          const json = JSON.parse(data);
          const content = json.choices[0].delta.content || "";
          aiResponse += content;
          aiMessageDiv.textContent = aiResponse;
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
    aiMessageDiv.textContent = "发生错误，请重试";
  }
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});