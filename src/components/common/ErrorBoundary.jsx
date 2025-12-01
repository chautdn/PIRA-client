import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Check if it's a React internal error
    const isReactInternalError =
      error?.message?.includes("inst") ||
      error?.message?.includes("fiber") ||
      error?.message?.includes("concurrent");

    this.setState((prevState) => ({
      error: error,
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // If it's a React internal error and we haven't retried too many times, auto-recover
    if (isReactInternalError && this.state.errorCount < 3) {
      console.log("Attempting automatic recovery from React internal error...");
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      const isReactInternalError =
        this.state.error?.message?.includes("inst") ||
        this.state.error?.message?.includes("fiber") ||
        this.state.error?.message?.includes("concurrent");

      // If it's a React internal error and we're auto-recovering, show nothing (brief flash)
      if (isReactInternalError && this.state.errorCount < 3) {
        return this.props.children;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đã xảy ra lỗi
              </h1>
              <p className="text-gray-600 mb-4">
                {isReactInternalError
                  ? "Đã xảy ra lỗi kỹ thuật với React. Vui lòng tải lại trang."
                  : "Có lỗi xảy ra khi tải trang. Vui lòng thử lại sau."}
              </p>

              {this.state.error && process.env.NODE_ENV === "development" && (
                <details className="text-left bg-gray-100 p-3 rounded mb-4">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    Chi tiết lỗi
                  </summary>
                  <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tải lại trang
                </button>
                <button
                  onClick={() => {
                    this.setState({
                      hasError: false,
                      error: null,
                      errorInfo: null,
                      errorCount: 0,
                    });
                  }}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => {
                    window.location.href = "/";
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
