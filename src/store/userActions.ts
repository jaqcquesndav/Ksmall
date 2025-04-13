import { setUser, updateUserProfile, setLoading, logout } from './slices/userSlice';
import { AppDispatch } from './index';
import { User } from '../services/UserService';

export { updateUserProfile, logout };

export const loginUser = (userData: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    // Here you would typically make an API call to authenticate the user
    // For now, we're just simulating a successful login
    dispatch(setUser(userData));
    return userData;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const registerUser = (userData: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    // Here you would typically make an API call to register the user
    // For now, we're just simulating a successful registration
    dispatch(setUser(userData));
    return userData;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const logoutUser = () => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    // Here you would typically make an API call to logout the user
    dispatch(logout());
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateUserData = (updates: Partial<User>) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    // Here you would typically make an API call to update the user's profile
    dispatch(updateUserProfile(updates));
    return updates;
  } catch (error) {
    console.error('Profile update failed:', error);
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
};
