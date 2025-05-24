import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

function Heading({ children, level = 1, ...props }: HeadingProps) {
  return React.createElement(`h${level}`, props, children);
}

function Title({ children, ...props }: HeadingProps) {
  return <Heading level={1} {...props}>{children}</Heading>;
}

function Header({ children, ...props }: HeadingProps) {
  return <Heading level={2} {...props}>{children}</Heading>;
}

function Subheader({ children, ...props }: HeadingProps) {
  return <Heading level={3} {...props}>{children}</Heading>;
}

export { Heading, Title, Header, Subheader };