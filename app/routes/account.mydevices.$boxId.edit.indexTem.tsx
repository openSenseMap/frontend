import type { LoaderArgs } from "@remix-run/node";
import {redirect } from "@remix-run/node";

//*****************************************************
// This page is the default of the outlet, which redirect to edit-device -> general 
export async function loader({ params }: LoaderArgs) {
  const deviceID = params.boxId;
  return redirect(`/account/mydevices/${deviceID}/edit/general`);
}