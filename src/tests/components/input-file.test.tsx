import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InputFile from "../../components/input-file";
import { useFormDispatcherWithAttr } from "../../core/context";

// Mock the context hooks
vi.mock("../../core/context", () => ({
  useFormDispatcherWithAttr: vi.fn(),
}));

describe("InputFile Component", () => {
  const defaultProps = {
    id: "test-file-input",
    label: "Upload File",
  };

  beforeEach(() => {
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(vi.fn());
  });

  it("renders with label", () => {
    render(<InputFile {...defaultProps} />);
    expect(screen.getByText("Upload File")).toBeInTheDocument();
  });

  it("shows required indicator when required prop is true", () => {
    render(<InputFile {...defaultProps} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders file input with correct type", () => {
    render(<InputFile {...defaultProps} />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("handles file selection and dispatches change event", () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(mockDispatch);

    render(<InputFile {...defaultProps} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a mock file
    const mockFile = new File(["test content"], "test.txt", {
      type: "text/plain",
    });

    // Create a proper FileList
    const mockFileList = [mockFile] as unknown as FileList;

    fireEvent.change(input, { target: { files: mockFileList } });

    expect(mockDispatch).toHaveBeenCalledWith(mockFileList);
  });

  it("dispatches null when files are cleared", () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(mockDispatch);

    render(<InputFile {...defaultProps} />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: null } });

    expect(mockDispatch).toHaveBeenCalledWith(null);
  });

  it("handles disabled state correctly", () => {
    render(<InputFile {...defaultProps} disabled />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it("applies additional props correctly", () => {
    render(
      <InputFile
        {...defaultProps}
        accept=".txt,.pdf"
        multiple
        data-testid="custom-file-input"
      />,
    );

    const input = screen.getByTestId("custom-file-input");
    expect(input).toHaveAttribute("accept", ".txt,.pdf");
    expect(input).toHaveAttribute("multiple");
  });

  it("associates label with input via htmlFor", () => {
    render(<InputFile {...defaultProps} />);
    const label = screen.getByText("Upload File");
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    expect(label).toHaveAttribute("for", "test-file-input");
    expect(input).toHaveAttribute("id", "test-file-input");
  });

  it("dispatches files on change with multiple files", () => {
    const mockDispatch = vi.fn();
    vi.mocked(useFormDispatcherWithAttr).mockReturnValue(mockDispatch);

    render(<InputFile {...defaultProps} multiple />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create multiple mock files
    const mockFile1 = new File(["content 1"], "file1.txt", {
      type: "text/plain",
    });
    const mockFile2 = new File(["content 2"], "file2.txt", {
      type: "text/plain",
    });

    // Create a proper FileList
    const mockFileList = [mockFile1, mockFile2] as unknown as FileList;

    fireEvent.change(input, { target: { files: mockFileList } });

    expect(mockDispatch).toHaveBeenCalledWith(mockFileList);
  });
});
