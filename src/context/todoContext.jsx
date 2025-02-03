import axios from "axios";
import { createContext, useState } from "react";
import { useGetUserID } from "../hooks/useGetUserID";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

export const TodosContext = createContext(null);

export default function TodoContextProvider(props) {
  const { children } = props;
  const [spinner, setSpinner] = useState(false);
  const [todoError, setTodoError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [editID, setEditID] = useState("");
  const [todos, setTodos] = useState([]);
  const [todoValue, setTodoValue] = useState();
  const [inputError, setInputError] = useState("");
  const [refreshTodos, setRefreshTodos] = useState(false);
  const userID = useGetUserID();
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const handleGetTodos = async () => {
    if (!cookies.access_token) {
      navigate("/login");
    }
    try {
      setSpinner(true);
      const result = await axios.get(
        `${import.meta.env.BACKEND_URL}/api/todos`,

        {
          headers: {
            authorization: localStorage.getItem("userID"),
          },
        }
      );

      if (!result) {
        console.log("server-error");
      }

      const todos = result.data.map((item) => item);
      setSpinner(false);
      return todos;
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setInputError("");
    if (!todoValue) {
      setInputError("Todo is required");
      return;
    }
    setSpinner(true);

    setInputError("");
    if (!cookies.access_token) {
      setInputError("You must have an account to add todos");
      return;
    }

    try {
      const result = await axios.post(
        `${import.meta.env.BACKEND_URL}/api/todos`,
        { todo: todoValue, userID },

        {
          headers: {
            "Content-Type": "application/json",
            authorization: cookies.access_token,
          },
        }
      );
      console.log(result);

      if (!result) {
        setInputError("something went wrong");
        return;
      }
      setSpinner(false);
      setTodoValue("");
      setInputError("");
      setRefreshTodos(true);
    } catch (error) {
      setInputError(error.response.data.message);
    }
  };

  const handleDelete = async (todoId) => {
    setSpinner(true);
    try {
      const result = await axios.delete(
        `${import.meta.env.BACKEND_URL}/api/todos/${todoId}`
      );
      console.log(result);
      setSpinner(false);
      setTodos(todos.filter((todo) => todo._id !== todoId));
      setTodoError("");
    } catch (err) {
      console.log(err);
      setTodoError("Failed to delete todo. Please try again.");
    }
  };

  const handleEdit = async () => {
    setInputValue("");
    try {
      const result = await axios.post(
        `${import.meta.env.BACKEND_URL}/api/todos/${editID}`,
        {
          todo: inputValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!inputValue) {
        setInputError("Please add a todo");
        return;
      }
      setInputError("");
      if (result.data === "updated") {
        setSpinner(true);
        setEditID("");
        setRefreshTodos(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggle = async (completeID, isCompleted) => {
    try {
      const result = await axios.post(
        `${import.meta.env.BACKEND_URL}/api/todos/completed/${completeID}`,
        {
          completed: !isCompleted,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log({ result });
      if (result.data === "completed") {
        setRefreshTodos(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <TodosContext.Provider
      value={{
        handleDelete,
        handleToggle,
        handleEdit,
        handleSubmit,
        handleGetTodos,
        todos,
        setTodos,
        todoError,
        inputError,
        refreshTodos,
        setRefreshTodos,
        todoValue,
        setTodoValue,
        editID,
        setEditID,
        inputValue,
        setInputValue,
        spinner,
      }}
    >
      {children}
    </TodosContext.Provider>
  );
}
