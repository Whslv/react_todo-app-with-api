/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  deleteTodo,
  getTodos,
  postTodo,
  updateTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { TodoList } from './components/TodoList';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const activeTodos = todos
    .filter(todo => !todo.completed)
    .map(todo => todo.id);
  const completedTodos = todos
    .filter(todo => todo.completed)
    .map(todo => todo.id);

  const inputRef = useRef<HTMLInputElement>(null);

  const onError = (errorString: string) => {
    setErrorMessage(errorString);
    setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      case 'all':
      default:
        return todo;
    }
  });

  const handleEditTitle = (todoId: number, title: string) => {
    setEditingTodoId(todoId);
    setNewTitle(title);
  };

  const handleSaveEditTitle = async (todosId: number) => {
    try {
      const cleanTitle = newTitle.trim();

      setLoadingTodoIds([todosId]);
      const updateTitle = await updateTodo(todosId, { title: cleanTitle });

      if (updateTitle) {
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === updateTitle.id
              ? { ...todo, title: updateTitle.title }
              : todo,
          ),
        );
        setLoadingTodoIds([]);
        setEditingTodoId(null);
        setNewTitle('');
      }
    } catch {
      onError('Unable to edit a todo');
    }
  };

  const handleUpdateStatus = async (todosId: number) => {
    try {
      setLoadingTodoIds([todosId]);
      const updatingTodoStatus = todos.find(todo => todo.id === todosId);

      if (updatingTodoStatus) {
        const canUpdateTodo = await updateTodo(todosId, {
          completed: !updatingTodoStatus.completed,
        });

        if (canUpdateTodo) {
          setTodos(
            todos.map(todo =>
              todo.id === todosId
                ? { ...todo, completed: !todo.completed }
                : todo,
            ),
          );
          setLoadingTodoIds([]);
        }
      }
    } catch (error) {
      onError('Unable to update a todo');
      setLoadingTodoIds([]);
    }
  };

  const handlUpdateAll = async () => {
    try {
      if (activeTodos.length > 0) {
        setLoadingTodoIds(activeTodos);

        const updateList = await Promise.allSettled(
          todos
            .filter(todo => !todo.completed)
            .map(todo => updateTodo(todo.id, { completed: !todo.completed })),
        );

        const hasErorr = updateList.some(item => item.status === 'rejected');

        const seccessIds = activeTodos
          .map((id, i) => (updateList[i].status === 'fulfilled' ? id : null))
          .filter((id): id is number => id !== null);

        setLoadingTodoIds([]);
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            seccessIds.includes(todo.id) ? { ...todo, completed: true } : todo,
          ),
        );

        if (hasErorr) {
          onError('Unable to update a todo');
        }
      } else {
        setLoadingTodoIds(completedTodos);

        const updateList = await Promise.allSettled(
          todos
            .filter(todo => todo.completed)
            .map(todo => updateTodo(todo.id, { completed: !todo.completed })),
        );

        const hasErorr = updateList.some(item => item.status === 'rejected');

        const seccessIds = completedTodos
          .map((id, i) => (updateList[i].status === 'fulfilled' ? id : null))
          .filter((id): id is number => id !== null);

        setLoadingTodoIds([]);
        setTodos(prevTodos =>
          prevTodos.map(todo =>
            seccessIds.includes(todo.id) ? { ...todo, completed: false } : todo,
          ),
        );

        if (hasErorr) {
          onError('Unable to update a todo');
        }
      }
    } catch {
      onError('Unable to update a todo');
    }
  };

  const handlClearAll = async () => {
    try {
      setLoadingTodoIds(completedTodos);
      const deletionList = await Promise.allSettled(
        completedTodos.map(id => deleteTodo(id)),
      );

      const hasErorr = deletionList.some(item => item.status === 'rejected');
      const seccessIds = completedTodos
        .map((id, i) => (deletionList[i].status === 'fulfilled' ? id : null))
        .filter((id): id is number => id !== null);

      setTodos(prev => prev.filter(todo => !seccessIds.includes(todo.id)));
      setLoadingTodoIds([]);

      if (hasErorr) {
        onError('Unable to delete a todo');
      }
    } catch {
      onError('Unable to delete a todo');
    }
  };

  const handleDelete = async (todosId: number) => {
    try {
      setLoadingTodoIds([todosId]);
      const deleteAproved = await deleteTodo(todosId);

      if (deleteAproved) {
        setTodos(filteredTodos.filter(todo => todo.id !== todosId));
        setLoadingTodoIds([]);
      }
    } catch (error) {
      onError('Unable to delete a todo');
      setLoadingTodoIds([]);
    }
  };

  const handleTodoSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === 'Enter') {
        e.preventDefault();
        const cleanInput = input.trim();

        if (cleanInput !== '') {
          const tempTodoObject: Todo = {
            id: 0,
            title: cleanInput,
            userId: USER_ID,
            completed: false,
          };

          setTempTodo(tempTodoObject);
          const newTodo = await postTodo(cleanInput);

          if (newTodo) {
            setTempTodo(null);
            setTodos([...todos, newTodo]);
            setInput('');
            setErrorMessage('');
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }
        }

        if (!cleanInput) {
          onError('Title should not be empty');
          setTempTodo(null);
        }
      }
    } catch (error) {
      onError('Unable to add a todo');
      setTempTodo(null);
    }
  };

  useEffect(() => {
    getTodos()
      .then((res: Todo[]) => {
        setTodos(res);
      })
      .catch(() => {
        onError('Unable to load todos');
      });
  }, []);

  useEffect(() => {
    if (tempTodo === null || loadingTodoIds) {
      inputRef.current?.focus();
    }
  }, [tempTodo, loadingTodoIds]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          todos={todos}
          inputRef={inputRef}
          tempTodo={tempTodo}
          input={input}
          activeTodos={activeTodos}
          setInput={setInput}
          handleTodoSubmit={handleTodoSubmit}
          handlUpdateAll={handlUpdateAll}
        />
        <TodoList
          filteredTodos={filteredTodos}
          loadingTodoIds={loadingTodoIds}
          tempTodo={tempTodo}
          editingTodoId={editingTodoId}
          newTitle={newTitle}
          handleDelete={handleDelete}
          handleUpdateStatus={handleUpdateStatus}
          handleEditTitle={handleEditTitle}
          handleSaveEditTitle={handleSaveEditTitle}
          setNewTitle={setNewTitle}
          setEditingTodoId={setEditingTodoId}
        />
        {todos.length > 0 && (
          <Footer
            activeTodos={activeTodos}
            completedTodos={completedTodos}
            filter={filter}
            setFilter={setFilter}
            handlClearAll={handlClearAll}
          />
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${errorMessage ? '' : 'hidden'}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => {
            setErrorMessage('');
          }}
        />
        {/* show only one message at a time */}
        {errorMessage}
        {/* Unable to update a todo */}
      </div>
    </div>
  );
};
