import  { type ArrayFieldTemplateProps } from "@rjsf/utils";
import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { title, items, canAdd, onAddClick } = props;

  const renderedItems = React.Children.toArray(items);

  return (
    <div className="space-y-3">
      {title ? (
        <div className="text-sm font-medium text-gray-700">{title}</div>
      ) : null}

      {renderedItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="pt-4">{item}</CardContent>
        </Card>
      ))}

      {canAdd && (
        <Button type="button" variant="outline" onClick={onAddClick}>
          Add item
        </Button>
      )}
    </div>
  );
}