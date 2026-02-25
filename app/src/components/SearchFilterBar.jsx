import { TASK_TYPES } from "../constants";

export default function SearchFilterBar({ searchQuery, onSearchChange, filterType, onFilterType, filterPriority, onFilterPriority, resultCount, totalCount }) {
  return (
    <div className="search-filter-bar">
      <div className="search-input-wrap">
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search tasks…  ( / )"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          id="task-search-input"
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => onSearchChange("")}>✕</button>
        )}
      </div>
      <div className="filter-group">
        <select className="filter-select" value={filterType} onChange={(e) => onFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filterPriority} onChange={(e) => onFilterPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      {(searchQuery || filterType || filterPriority) && (
        <span className="filter-count">{resultCount}/{totalCount} tasks</span>
      )}
    </div>
  );
}
