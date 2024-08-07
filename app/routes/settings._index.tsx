import {redirect } from "@remix-run/node";

//*****************************************************
// This page is the default of the outlet, which redirect to settings -> profile 
export async function loader() {
  return redirect(`/settings/profile`);
}