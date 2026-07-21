$files = Get-ChildItem -Path . -Recurse -Include AuthResponse.java,UserDto.java,DeckDto.java,QuestionDto.java,PaginatedQuestionsResponse.java,SessionState.java,StartSessionRequest.java,SubmitAnswerRequest.java,SubmitAnswerResponse.java,SessionResult.java,UserStats.java,SessionHistoryItem.java,DailyActivityDto.java,EvaluationRequest.java,EvaluationResponse.java
foreach ($f in $files) {
    Write-Output "`n--- $($f.Name) ---"
    Get-Content $f.FullName
}
