// import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const dummyBoxes = [
  {
    name: "senseBox am Aasee",
    id: "1",
    image: "/sensebox_outdoor.jpg",
  },
  {
    name: "Box am IFGI",
    id: "2",
    image: "https://picsum.photos/200/300",
  },
  {
    name: "Box im Schlossgarten",
    id: "3",
    image: "https://picsum.photos/200/300",
  },
];

export default function ProfileBoxSelection() {
  //   const [selectedBox, setSelectedBox] = useState(dummyBoxes[0]);
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>{dummyBoxes[0].name}</CardTitle>
          <CardDescription>Letzte Aktivität: vor 13min</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <img
              className="max-w-24 max-h-24 rounded-lg"
              alt=""
              src={dummyBoxes[0].image}
            ></img>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <Select disabled={true}>
            <SelectTrigger className="">
              <SelectValue placeholder="Box am IFGI" />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={-250}>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </CardFooter>
      </Card>
    </div>
  );
}
