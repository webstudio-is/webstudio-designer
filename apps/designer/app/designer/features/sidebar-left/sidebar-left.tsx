import { useState } from "react";
import { useSubscribe, type Publish } from "@webstudio-is/react-sdk";
import type { Asset } from "@webstudio-is/prisma-client";
import {
  Box,
  SidebarTabs,
  SidebarTabsContent,
  SidebarTabsList,
  SidebarTabsTrigger,
} from "@webstudio-is/design-system";
import { useSelectedInstanceData } from "../../shared/nano-states";
import { useDragAndDropState } from "~/shared/nano-states";
import { panels } from "./panels";
import type { TabName } from "./types";
import { isFeatureEnabled } from "~/shared/feature-flags";

const sidebarTabsContentStyle = {
  position: "absolute",
  left: "100%",
  width: 250,
  height: "100%",
  bc: "$loContrast",
  // @todo: focus state should be same as hover/active state: hover and focus yes, probably same, active? not so sure.
  outline: "none",
};

const none = { TabContent: () => null };

type SidebarLeftProps = {
  publish: Publish;
  assets: Array<Asset>;
};

export const SidebarLeft = ({ publish, assets }: SidebarLeftProps) => {
  const [selectedInstanceData] = useSelectedInstanceData();
  const [dragAndDropState] = useDragAndDropState();
  const [activeTab, setActiveTab] = useState<TabName>("none");
  const { TabContent } = activeTab === "none" ? none : panels[activeTab];

  useSubscribe<"clickCanvas">("clickCanvas", () => {
    setActiveTab("none");
  });
  useSubscribe<"dragEnd">("dragEnd", () => {
    setActiveTab("none");
  });

  const enabledPanels = (
    isFeatureEnabled("assets")
      ? Object.keys(panels)
      : Object.keys(panels).filter((panel) => panel !== "assetManager")
  ) as Array<TabName>;

  return (
    <Box css={{ position: "relative", zIndex: 1 }}>
      <SidebarTabs activationMode="manual" value={activeTab}>
        <SidebarTabsList>
          {enabledPanels.map((tabName: TabName) => (
            <SidebarTabsTrigger
              aria-label={tabName}
              key={tabName}
              value={tabName}
              onClick={() => {
                setActiveTab(activeTab !== tabName ? tabName : "none");
              }}
            >
              {tabName === "none" ? null : panels[tabName].icon}
            </SidebarTabsTrigger>
          ))}
        </SidebarTabsList>
        <SidebarTabsContent
          value={activeTab === "none" ? "" : activeTab}
          css={{
            ...sidebarTabsContentStyle,
            // We need the node to be rendered but hidden
            // to keep receiving the drag events.
            visibility:
              dragAndDropState.isDragging && dragAndDropState.origin === "panel"
                ? "hidden"
                : "visible",
            overflow: "auto",
          }}
        >
          <TabContent
            assets={assets}
            selectedInstanceData={selectedInstanceData}
            publish={publish}
            onSetActiveTab={setActiveTab}
          />
        </SidebarTabsContent>
      </SidebarTabs>
    </Box>
  );
};
