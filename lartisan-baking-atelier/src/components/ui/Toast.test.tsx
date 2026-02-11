import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";
import { Toast } from "./Toast";

// Mock Framer Motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("Toast Component", () => {
  it("renders success toast correctly", () => {
    render(<Toast type="success" message="Operation successful" />);

    expect(screen.getByText("Operation successful")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders error toast correctly", () => {
    render(<Toast type="error" message="An error occurred" />);

    expect(screen.getByText("An error occurred")).toBeInTheDocument();
  });

  it("renders warning toast correctly", () => {
    render(<Toast type="warning" message="Warning message" />);

    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("renders info toast correctly", () => {
    render(<Toast type="info" message="Information message" />);

    expect(screen.getByText("Information message")).toBeInTheDocument();
  });

  it("renders toast with title", () => {
    render(
      <Toast type="success" title="Success!" message="Operation complete" />,
    );

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Operation complete")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <Toast type="success" message="Test message" onDismiss={onDismiss} />,
    );

    const dismissButton = screen.getByLabelText("Dismiss notification");
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not show dismiss button when onDismiss is not provided", () => {
    render(<Toast type="success" message="Test message" />);

    expect(
      screen.queryByLabelText("Dismiss notification"),
    ).not.toBeInTheDocument();
  });
});

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function TestComponent() {
    const { showToast, dismissToast, clearToasts } = useToast();

    return (
      <div>
        <button
          onClick={() => showToast({ type: "success", message: "Success!" })}
        >
          Show Success
        </button>
        <button onClick={() => showToast({ type: "error", message: "Error!" })}>
          Show Error
        </button>
        <button onClick={() => clearToasts()}>Clear All</button>
      </div>
    );
  }

  it("shows toast when showToast is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success!")).toBeInTheDocument();
  });

  it("shows multiple toasts", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();
  });

  it("auto-dismisses toast after duration", async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    expect(screen.getByText("Success!")).toBeInTheDocument();

    // Fast-forward past the default 5000ms duration
    vi.advanceTimersByTime(6000);

    await waitFor(() => {
      expect(screen.queryByText("Success!")).not.toBeInTheDocument();
    });
  });

  it("clears all toasts when clearToasts is called", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));
    fireEvent.click(screen.getByText("Show Error"));

    expect(screen.getByText("Success!")).toBeInTheDocument();
    expect(screen.getByText("Error!")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear All"));

    expect(screen.queryByText("Success!")).not.toBeInTheDocument();
    expect(screen.queryByText("Error!")).not.toBeInTheDocument();
  });

  it("renders in correct region", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText("Show Success"));

    const region = screen.getByLabelText("Notifications");
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("role", "region");
  });

  it("limits toasts to maximum of 3", () => {
    function MultipleToasts() {
      const { showToast } = useToast();

      return (
        <button
          onClick={() =>
            showToast({ type: "success", message: `Toast ${Date.now()}` })
          }
        >
          Add Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <MultipleToasts />
      </ToastProvider>,
    );

    const button = screen.getByText("Add Toast");

    // Add 5 toasts
    for (let i = 0; i < 5; i++) {
      fireEvent.click(button);
      vi.advanceTimersByTime(100); // Small delay between clicks
    }

    const toasts = screen.getAllByRole("alert");
    expect(toasts).toHaveLength(3);
  });
});

describe("useToast Hook", () => {
  it("throws error when used outside ToastProvider", () => {
    function TestComponent() {
      try {
        useToast();
        return <div>No error</div>;
      } catch (e) {
        return <div>Error caught</div>;
      }
    }

    render(<TestComponent />);
    expect(screen.getByText("Error caught")).toBeInTheDocument();
  });
});
