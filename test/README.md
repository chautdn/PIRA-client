# Test Files

This folder contains all test files for the PIRA client application.

## Structure

Mirror the `src/` folder structure for easy navigation:

```
test/
├── components/
│   ├── Auth.test.jsx         # Auth component tests
│   ├── Modal.test.jsx        # Modal component tests
│   └── common/
│       └── Portal.test.jsx   # Portal component tests
├── hooks/
│   ├── useAuth.test.js       # useAuth hook tests
│   └── useWallet.test.js     # useWallet hook tests
├── utils/
│   ├── formatters.test.js    # Formatter utility tests
│   └── validators.test.js    # Validator utility tests
└── services/
    └── api.test.js           # API service tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- test/hooks/useAuth.test.js
```

## Writing Tests

### Component Tests (`.test.jsx`)

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyComponent from "../src/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Hook Tests (`.test.js`)

```javascript
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "../src/hooks/useMyHook";

describe("useMyHook", () => {
  it("should return correct initial state", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(0);
  });
});
```

## Testing Guidelines

1. **File naming**: `ComponentName.test.jsx` or `utilName.test.js`
2. **Test isolation**: Each test should be independent
3. **Mock dependencies**: Mock API calls, external services
4. **Test user interactions**: Use `@testing-library/user-event`
5. **Accessibility**: Test with screen readers in mind

## Common Patterns

### Mocking API calls

```javascript
import api from "../src/services/api";
jest.mock("../src/services/api");

api.get.mockResolvedValue({ data: { user: { name: "Test" } } });
```

### Testing async operations

```javascript
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

## Notes

- **GITIGNORED**: Test files are not included in production builds
- Keep tests close to what they test (mirror src/ structure)
- Update tests when changing components
- Aim for high coverage on critical paths
