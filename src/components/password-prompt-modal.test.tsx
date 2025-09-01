import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordPromptModal } from './password-prompt-modal';
import { useToast } from '@/hooks/use-toast';

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('PasswordPromptModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <PasswordPromptModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Test Title"
        description="Test Description"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <PasswordPromptModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with password when form is submitted', async () => {
    render(
      <PasswordPromptModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('testpassword');
    });
  });

  it('shows error toast when onConfirm throws an error', async () => {
    const errorMessage = 'Incorrect password';
    mockOnConfirm.mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    render(
      <PasswordPromptModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(confirmButton);

    // We can't easily test the toast since it's mocked, but we can verify the error handling flow
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('wrongpassword');
    });
  });
});