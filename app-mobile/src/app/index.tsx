import { Redirect } from "expo-router";
import { useSession } from "@/hooks/useSession";

export default function Index() {
  const { state } = useSession();

  return <Redirect href={state.status === "authenticated" ? "/painel" : "/login"} />;
}
