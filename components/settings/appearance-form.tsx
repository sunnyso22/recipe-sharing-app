"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

const emptySubscribe = () => () => {};

const isThemeValue = (value: string | undefined): value is ThemeValue => {
  return value === "light" || value === "dark" || value === "system";
};

const AppearanceForm = () => {
  const { theme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const selectedTheme: ThemeValue =
    isClient && isThemeValue(theme) ? theme : "system";

  const selectTheme = (value: unknown, eventDetails: { reason: string }) => {
    if (
      eventDetails.reason !== "none" ||
      typeof value !== "string" ||
      !isThemeValue(value)
    ) {
      return;
    }

    setTheme(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          <h2>Appearance</h2>
        </CardTitle>
        <CardDescription>
          Choose how Cookery looks on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTheme} onValueChange={selectTheme}>
          <TabsList className="w-full">
            {themes.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export { AppearanceForm };
