import { type ChildrenUpdates, type Instance } from "@webstudio-is/sdk";
import {
  RichTextPlugin,
  HistoryPlugin,
  InstancePlugin,
  ToolbarConnectorPlugin,
  OnChangePlugin,
} from "~/canvas/features/wrapper-component/text-editor";

type EditorProps = {
  editable: JSX.Element;
  children: Array<Instance | string>;
  onChange: (udpates: ChildrenUpdates) => void;
};

export const Editor = ({ children, editable, onChange }: EditorProps) => {
  return (
    <>
      <RichTextPlugin contentEditable={editable} placeholder="" />
      <OnChangePlugin onChange={onChange} />
      <HistoryPlugin />
      <InstancePlugin>{children}</InstancePlugin>
      <ToolbarConnectorPlugin />
    </>
  );
};