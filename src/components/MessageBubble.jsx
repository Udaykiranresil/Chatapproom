import { motion } from "framer-motion";

export default function MessageBubble({ message, isOwn, dissolving }) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={
        dissolving
          ? { opacity: 0, filter: "blur(6px)", scale: 0.92, y: -6 }
          : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: dissolving ? 0.5 : 0.25, ease: "easeOut" }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={[
          "max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
          message.type === "gif" ? "p-1.5" : "",
          isOwn
            ? "bg-signal/90 text-white rounded-br-md"
            : "glass-panel text-paper rounded-bl-md",
        ].join(" ")}
      >
        {message.type === "gif" ? (
          <img
            src={message.content}
            alt="GIF"
            className="rounded-xl max-w-[220px] w-full block"
            loading="lazy"
          />
        ) : message.type === "emoji" ? (
          <span className="text-3xl leading-none block py-0.5">{message.content}</span>
        ) : (
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        )}
        <div
          className={`mt-1 text-[10px] tracking-wide ${
            isOwn ? "text-white/60 text-right" : "text-mist/60"
          }`}
        >
          {time}
        </div>
      </div>
    </motion.div>
  );
}
