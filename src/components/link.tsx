interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  isExternal?: boolean;
  text?: string;
  replace?: boolean;
}


function Link({ text, children, id, href, replace, isExternal, ...props }: LinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isExternal) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const event = new CustomEvent<NavigateEventPayload>("routelit:event", {
      detail: {
        id: id!,
        type: "navigate",
        href: href!,
        replace: replace,
      },
    });
    document.dispatchEvent(event);
  };
  return (
    <a id={id} href={href} onClick={handleClick} {...props}>
      {text || children}
    </a>
  );
}

export default Link;
