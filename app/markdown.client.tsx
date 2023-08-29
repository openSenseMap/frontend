import MDEditor from "@uiw/react-md-editor";
import { iconConfig } from "./editor-icon-config";
import rehypeSanitize from "rehype-sanitize";
import rehypeVideo from "rehype-video";

type MDEditorProps = {
  comment: string | undefined;
  setComment: (comment: string | undefined) => void;
  textAreaRef: any;
};

export const MarkdownEditor = ({
  comment,
  setComment,
  textAreaRef,
}: MDEditorProps) => {
  return (
    <MDEditor
      ref={textAreaRef}
      height={200}
      //@ts-ignore
      commands={Object.keys(iconConfig).map((key) => iconConfig[key])}
      preview="live"
      value={comment}
      onChange={setComment}
      previewOptions={{
        rehypePlugins: [[rehypeVideo]],
      }}
      textareaProps={{
        spellCheck: "true",
        placeholder: "Leave a comment...",
      }}
    />
  );
};
