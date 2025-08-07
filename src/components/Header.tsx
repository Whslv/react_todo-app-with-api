import React from 'react';
import { Todo } from '../types/Todo';

interface HeaderProps {
  todos: Todo[];
  inputRef: React.LegacyRef<HTMLInputElement>;
  tempTodo: Todo | null;
  input: string;
  activeTodos: number[];
  setInput: (input: string) => void;
  handleTodoSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlUpdateAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  todos,
  inputRef,
  tempTodo,
  input,
  activeTodos,
  setInput,
  handleTodoSubmit,
  handlUpdateAll,
}) => {
  return (
    <header className="todoapp__header">
      {todos.length > 0 && (
        <button
          type="button"
          className={`todoapp__toggle-all ${activeTodos.length === 0 && 'active'}`}
          data-cy="ToggleAllButton"
          onClick={() => {
            handlUpdateAll();
          }}
        />
      )}

      <form>
        <input
          data-cy="NewTodoField"
          ref={inputRef}
          type="text"
          disabled={tempTodo !== null}
          value={input}
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          onKeyDown={e => {
            handleTodoSubmit(e);
          }}
          onChange={e => {
            setInput(e.target.value);
          }}
        />
      </form>
    </header>
  );
};
