import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  body: React.ReactNode;
}

function Heading({ body, level = 1, ...props }: HeadingProps) {
  return React.createElement(`h${level}`, props, body);
}

function Title({ body, ...props }: HeadingProps) {
  return <Heading level={1} {...props} body={body} />;
}

function Header({ body, ...props }: HeadingProps) {
  return <Heading level={2} {...props} body={body} />;
}

function Subheader({ body, ...props }: HeadingProps) {
  return <Heading level={3} {...props} body={body} />;
}

export { Heading, Title, Header, Subheader };