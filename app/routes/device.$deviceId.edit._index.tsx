import type { LoaderFunctionArgs } from "@remix-run/node";
import {redirect } from "@remix-run/node";

//*****************************************************
// This page is the default of the outlet, which redirect to edit-device -> general 
export async function loader({ params }: LoaderFunctionArgs) {
  const deviceID = params.deviceId;
  return redirect(`/device/${deviceID}/edit/general`);
}