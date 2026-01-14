import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
Form, Link, Outlet, useActionData, // useFormAction,
// useNavigation,
useLoaderData, type ActionFunctionArgs, type LoaderFunctionArgs 
} from "react-router";
import ErrorMessage from "~/components/error-message";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useToast } from "~/components/ui/use-toast";
import { getProfileByUserId, updateProfile } from "~/models/profile.server";
import { getInitials } from "~/utils/misc";
import { requireUserId } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const profile = await getProfileByUserId(userId);
  if (!profile) {
    // throw await authenticator.logout(request, { redirectTo: "/" });
    throw new Error();
  }
  return { profile };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const profile = await getProfileByUserId(userId);
  const formData = await request.formData();
  const username = formData.get("username");
  const isPublic = formData.get("isPublic");

  if (!profile || !userId) {
    return {
      success: false,
      message: "Something went wrong.",
    };
  }

  const updatedProfile = await updateProfile(
    profile?.id as string,
    username as string,
    isPublic === "on",
  );

  return {
    success: true,
    updatedProfile,
  };
}

export default function EditUserProfilePage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [username, setUsername] = useState(data.profile.username);
  const [isPublic, setIsPublic] = useState(data.profile.public || false);

  //* toast
  const { toast } = useToast();

  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
          variant: "success",
        });
      } else {
        toast({
          title: "Something went wrong.",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    }
  }, [actionData, toast]);

  return (
    <Form method="post">
      <Card className="space-y-6 dark:bg-dark-boxes dark:border-white">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            This is how others see your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex">
          <div className="space-y-6 w-1/2 justify-center">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="username">Username</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {
                          "If your profile is public, this is how people will see you."
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                min={3}
                max={40}
                type="text"
                id="username"
                name="username"
                placeholder="Enter your new username"
                defaultValue={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="isPublic">Public Profile</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        If activated, others will be able to see your public{" "}
                        <Link to="/profile/me" target="__blank">
                          <span className="underline">profile</span>
                        </Link>
                        .
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                id="isPublic"
                name="isPublic"
                defaultChecked={isPublic}
                onCheckedChange={(e) => setIsPublic(e)}
              />
            </div>
          </div>
          <div className="flex w-1/2 justify-center">
            <div className="relative h-52 w-52">
              <Avatar className="h-full w-full">
                <AvatarImage
                  className="aspect-auto w-full h-full rounded-full object-cover"
                  src={"/resources/file/" + data.profile.profileImage?.id}
                />
                <AvatarFallback>
                  {getInitials(data.profile?.username ?? "")}
                </AvatarFallback>
              </Avatar>
              <Link
                preventScrollReset
                to="photo"
                className="border-night-700 bg-night-500 absolute -right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border-4 p-5 pointer-events-auto"
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                &#x270E;
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={
              username === data.profile.username &&
              isPublic === data.profile.public
            }
          >
            Save changes
          </Button>
        </CardFooter>
        <Outlet />
      </Card>
    </Form>
  );
}

export function ErrorBoundary() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <ErrorMessage />
    </div>
  );
}
