package model

import "time"

type School struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Name       string    `json:"name" gorm:"size:150;not null;uniqueIndex"`
	Code       string    `json:"code" gorm:"size:10;not null;uniqueIndex"`
	UIDCounter int       `json:"uid_counter" gorm:"default:0"`
	CreatedAt  time.Time `json:"created_at"`
}