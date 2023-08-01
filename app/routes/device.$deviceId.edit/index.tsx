import {redirect, LoaderArgs } from "@remix-run/node";

//*****************************************************
// This page is the default of the outlet, which redirect to edit-device -> general 
export async function loader({ params }: LoaderArgs) {
  const deviceID = params.deviceId;
  return redirect(`/device/${deviceID}/edit/general`);
}
